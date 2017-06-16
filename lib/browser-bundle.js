"use strict"

/**
 * This is the entry point for the Browserify bundle. Note that it *also* will
 * run as part of the tests in Node (unbundled), and it theoretically could be
 * run in Node or a runtime limited to only ES5 support (e.g. Rhino, Nashorn, or
 * embedded V8), so do *not* assume browser globals are present.
 */

var t = require("../index")
var dom = require("../dom")

global.t = t
global.assert = require("../assert")
t.dom = dom
t.internal = require("../internal")

function autoload(script) {
    if (!script.hasAttribute("data-files")) return

    function set(opts, attr, transform) {
        var value = script.getAttribute("data-" + attr)

        if (value) opts[attr] = transform(value)
    }

    var files = script.getAttribute("data-files").trim()
    var opts = {files: files ? files.split(/\s+/g) : []}

    set(opts, "onready", Function)
    set(opts, "timeout", Number)
    set(opts, "preload", Function)
    set(opts, "prerun", Function)
    set(opts, "postrun", Function)
    set(opts, "onerror", function (attr) {
        return new Function("err", attr) // eslint-disable-line
    })

    if (global.document.readyState !== "loading") {
        dom(opts).run()
    } else {
        global.document.addEventListener("DOMContentLoaded", function () {
            dom(opts).run()
        })
    }
}

if (global.document != null && global.document.currentScript != null) {
    autoload(global.document.currentScript)
}

// In case the user needs to adjust these (e.g. Nashorn + console output).
t.console = require("./replaced/console")
