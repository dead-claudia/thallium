"use strict"

/**
 * This is the entry point for the Browserify bundle. Note that it *also* will
 * run as part of the tests in Node (unbundled), and it theoretically could be
 * run in Node or a runtime limited to only ES5 support (e.g. Rhino, Nashorn, or
 * embedded V8), so do *not* assume browser globals are present.
 */

var Thallium = require("./api/thallium")
var t = global.t = new Thallium()

global.assert = require("clean-assert")
global.t.dom = require("../dom")
global.t.internal = require("../internal")
// In case the user needs to adjust these (e.g. Nashorn + console output).
global.t.console = require("./replaced/console")

var script = global.document && global.document.currentScript

function set(opts, attr, transform) {
    var value = script.getAttribute("data-" + attr)

    if (value) opts[attr] = transform(value)
}

if (script != null && script.hasAttribute("data-files")) {
    var files = script.getAttribute("data-files").trim()
    var opts = {files: files ? files.split(/\s+/g) : []}

    set(opts, "onready", Function)
    set(opts, "timeout", Number)
    set(opts, "preload", Function)
    set(opts, "prerun", Function)
    set(opts, "postrun", Function)
    set(opts, "onerror", Function.bind("err"))

    if (global.document.readyState !== "loading") {
        t.dom(opts).run()
    } else {
        global.document.addEventListener("DOMContentLoaded", function () {
            t.dom(opts).run()
        })
    }
}
