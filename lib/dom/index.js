"use strict"

/**
 * The DOM reporter and loader entry point. See the README.md for more details.
 */

var initialize = require("./initialize")

module.exports = function (opts) {
    if (opts == null) return initialize({})
    if (Array.isArray(opts)) return initialize({files: opts})
    if (typeof opts === "object") return initialize(opts)
    throw new TypeError("`opts` must be an object or array of files if passed")
}

if (global.document != null && global.document.currentScript != null) {
    (function () {
        var script = global.document.currentScript
        var files = script.getAttribute("data-files")

        function set(opts, attr, transform) {
            var value = script.getAttribute("data-" + attr)

            if (value) opts[attr] = transform(value)
        }

        if (files) {
            var opts = {files: files.trim().split(/\s+/g)}

            set(opts, "timeout", Number)
            set(opts, "preload", Function)
            set(opts, "prerun", Function)
            set(opts, "postrun", Function)
            set(opts, "error", function (attr) {
                return new Function("err", attr) // eslint-disable-line
            })
            initialize(opts).run()
        }
    })()
}
