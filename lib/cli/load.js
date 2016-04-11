"use strict"

const assert = require("assert")
const Promise = require("bluebird")

const isObjectLike = v =>
    v != null && (typeof v === "object" || typeof v === "function")

/**
 * Load the config using the data from `infer-location.js` unadultered.
 *
 * @param  {State} state The parsed command line arguments
 * @param  {Object} data The data from `infer-location.js`, using `file` and
 *                       `loaders`, possibly a thenable.
 * @return {Object} The raw config data.
 */
module.exports = (state, data) => {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof state, "object")
        assert.notEqual(state, null)
        assert.equal(typeof data, "object")
        assert.notEqual(data, null)
    }

    // Load all previously marked modules.
    data.loaders.list.forEach(loader => loader.register())

    const loaded = data.file != null ? state.load(data.file) : null

    return Promise.resolve(loaded).then(data => {
        if (!isObjectLike(data)) return {}
        // not ES6 transpiled module
        if (isObjectLike(data.default)) return data.default
        return data
    })
}
