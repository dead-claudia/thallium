"use strict"

var Promise = require("bluebird")
var Common = require("./common.js")

/**
 * Load the config using the file from `find-config.js` and the loader map.
 * `load` is `state.util.load` from the command line state, `file` is the config
 * file, and `loaders` contain all the loaders to register. It returns a promise
 * to the loaded config.
 */
module.exports = function (load, file, loaders, baseDir) {
    // Load all previously marked modules.
    return Promise.each(Object.keys(loaders), function (key) {
        return loaders[key].register(baseDir)
    })
    .then(function () {
        if (file == null) return {}
        return Common.resolveDefault(load(file, baseDir))
    })
    .then(function (data) {
        return Common.isObjectLike(data) ? data : {}
    })
}
