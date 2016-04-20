"use strict"

const Promise = require("bluebird")

const isObjectLike = v =>
    v != null && (typeof v === "object" || typeof v === "function")

/**
 * Load the config using the file from `find-config.js` and the loader map.
 * `load` is `state.util.load` from the command line state, `file` is the config
 * file, and `loaders` contain all the loaders to register. It returns a promise
 * to the loaded config.
 */
module.exports = (load, file, loaders) => {
    // Load all previously marked modules.
    for (const loader of loaders.values()) {
        loader.register()
    }

    const loaded = file != null ? load(file) : null

    return Promise.resolve(loaded).then(data => {
        if (!isObjectLike(data)) return {}
        // not ES6 transpiled module
        if (isObjectLike(data.default)) return data.default
        return data
    })
}
