"use strict"

/**
 * This is the entry point for the Browserify bundle. Note that it *also* will
 * run as part of the tests in Node (unbundled), and it theoretically could be
 * run in Node or a runtime limited to only ES5 support (e.g. Rhino, Nashorn, or
 * embedded V8), so do *not* assume browser globals are present.
 */

exports.t = require("../index.js")
exports.assert = require("../assert.js")
exports.match = require("../match.js")

/* eslint-disable global-require */

exports.r = {
    // dom: require("../r/dom.js"),
    dot: require("../r/dot.js"),
    spec: require("../r/spec.js"),
    tap: require("../r/tap.js"),
}

/* eslint-enable global-require */

// In case the user needs to adjust this (e.g. Nashorn + console output).
var Settings = require("./settings.js")

exports.settings = {
    windowWidth: {
        get: Settings.windowWidth,
        set: Settings.setWindowWidth,
    },

    newline: {
        get: Settings.newline,
        set: Settings.setNewline,
    },

    symbols: {
        get: Settings.symbols,
        set: Settings.setSymbols,
    },

    defaultOpts: {
        get: Settings.defaultOpts,
        set: Settings.setDefaultOpts,
    },

    colorSupport: {
        get: Settings.Colors.getSupport,
        set: Settings.Colors.setSupport,
    },
}

// Note: both of these are deprecated
exports.assertions = require("../assertions.js")
exports.create = exports.t.create
