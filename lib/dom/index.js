"use strict"

/**
 * The DOM reporter and loader entry point. See the README.md for more details.
 */

var initialize = require("./initialize")
var t = require("../../index")
var assert = require("../../assert")

exports.create = function (opts) {
    if (opts == null) return initialize({})
    if (Array.isArray(opts)) return initialize({files: opts})
    if (typeof opts === "object") return initialize(opts)
    throw new TypeError("`opts` must be an object or array of files if passed")
}

exports.autoload = function (script) {
    var files = script.getAttribute("data-files")

    if (!files) return

    function set(opts, attr, transform) {
        var value = script.getAttribute("data-" + attr)

        if (value) opts[attr] = transform(value)
    }

    var opts = {files: files.trim().split(/\s+/g)}

    set(opts, "timeout", Number)
    set(opts, "preload", Function)
    set(opts, "prerun", Function)
    set(opts, "postrun", Function)
    set(opts, "error", function (attr) {
        return new Function("err", attr) // eslint-disable-line
    })

    // Convenience.
    global.t = t
    global.assert = assert

    if (global.document.readyState !== "loading") {
        initialize(opts).run()
    } else {
        global.document.addEventListener("DOMContentLoaded", function () {
            initialize(opts).run()
        })
    }
}
