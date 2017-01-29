"use strict"

/**
 * The reporter and test initialization sequence, and script loading. This
 * doesn't understand anything view-wise.
 */

var defaultT = require("../../index")
var R = require("../reporter")
var D = require("./inject")
var runTests = require("./run-tests")
var injectStyles = require("./inject-styles")
var View = require("./view")

function Tree(name) {
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

var reporter = R.on("dom", {
    accepts: [],
    create: function (opts, methods) {
        var reporter = new R.Reporter(Tree, undefined, methods)

        reporter.opts = opts
        return reporter
    },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function () {
        return new Promise(function (resolve) {
            if (D.window.requestAnimationFrame) {
                D.window.requestAnimationFrame(resolve)
            } else {
                global.setTimeout(resolve, 0)
            }
        })
    },

    report: function (_, report) {
        return View.report(_, report)
    },
})

function noop() {}

function setDefaultsChecked(opts) {
    if (opts.title == null) opts.title = "Thallium tests"
    if (opts.timeout == null) opts.timeout = 2000
    if (opts.files == null) opts.files = []
    if (opts.preload == null) opts.preload = noop
    if (opts.prerun == null) opts.prerun = noop
    if (opts.postrun == null) opts.postrun = noop
    if (opts.error == null) opts.error = noop
    if (opts.thallium == null) opts.thallium = defaultT

    if (typeof opts.title !== "string") {
        throw new TypeError("`opts.title` must be a string if passed")
    }

    if (typeof opts.timeout !== "number") {
        throw new TypeError("`opts.timeout` must be a number if passed")
    }

    if (!Array.isArray(opts.files)) {
        throw new TypeError("`opts.files` must be an array if passed")
    }

    if (typeof opts.preload !== "function") {
        throw new TypeError("`opts.preload` must be a function if passed")
    }

    if (typeof opts.prerun !== "function") {
        throw new TypeError("`opts.prerun` must be a function if passed")
    }

    if (typeof opts.postrun !== "function") {
        throw new TypeError("`opts.postrun` must be a function if passed")
    }

    if (typeof opts.error !== "function") {
        throw new TypeError("`opts.error` must be a function if passed")
    }

    if (typeof opts.thallium !== "object") {
        throw new TypeError(
            "`opts.thallium` must be a Thallium instance if passed")
    }
}

module.exports = function (opts) {
    setDefaultsChecked(opts)
    if (!D.document.title) D.document.title = opts.title
    injectStyles()
    var state = View.initState(opts)

    opts.thallium.reporter(reporter, state)
    return {
        run: function () {
            return runTests(opts, state)
        },
    }
}
