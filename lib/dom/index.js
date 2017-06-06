"use strict"

/**
 * The reporter and test initialization sequence, and script loading. This
 * doesn't understand anything view-wise.
 */

var defaultT = require("../../index")

var assert = require("../util").assert
var methods = require("../methods")
var R = require("../reporter")

var D = require("./inject")
var runTests = require("./run-tests")
var injectStyles = require("./inject-styles")
var View = require("./view")

function Tree(name) {
    assert(name == null || typeof name === "string")
    this.name = name
    this.status = R.Status.Unknown
    this.node = null
    this.children = Object.create(null)
}

var reporter = R.on("dom", {
    accepts: [],
    create: function (opts, methods) {
        assert(opts != null && typeof opts === "object")
        assert(methods != null && typeof methods === "object")

        var reporter = new R.Reporter(Tree, undefined, methods, false)

        reporter.opts = opts
        return reporter
    },

    // Give the browser a chance to repaint before continuing (microtasks
    // normally block rendering).
    after: function () {
        return new Promise(View.nextFrame)
    },

    report: function (_, report) {
        return View.report(_, report)
    },
})

function noop() {}

function setDefaultsChecked(opts) {
    assert(opts != null && typeof opts === "object")

    if (opts.title == null) opts.title = "Thallium tests"
    if (opts.timeout == null) opts.timeout = 5000
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

function onReady(init) {
    assert(typeof init === "function")

    if (D.document.body != null) return Promise.resolve(init())
    return new Promise(function (resolve) {
        D.document.addEventListener("DOMContentLoaded", function () {
            resolve(init())
        }, false)
    })
}

function DOM(opts) {
    assert(opts != null && typeof opts === "object")

    this._opts = opts
    this._destroyPromise = undefined
    this._data = onReady(function () {
        setDefaultsChecked(opts)
        if (!D.document.title) D.document.title = opts.title
        injectStyles()
        var data = View.init(opts)

        opts.thallium.reporter(reporter, data.state)
        return data
    })
}

methods(DOM, {
    run: function () {
        if (this._destroyPromise != null) {
            return Promise.reject(new Error(
                "The test suite must not be run after the view has been " +
                "detached."
            ))
        }

        var opts = this._opts

        return this._data.then(function (data) {
            return runTests(opts, data.state)
        })
    },

    detach: function () {
        if (this._destroyPromise != null) return this._destroyPromise
        var self = this

        return this._destroyPromise = self._data.then(function (data) {
            data.state.locked = true
            if (data.state.currentPromise == null) return data
            return data.state.currentPromise.then(function () { return data })
        })
        .then(function (data) {
            self._opts = undefined
            self._data = self._destroyPromise

            while (data.root.firstChild) {
                data.root.removeChild(data.root.firstChild)
            }
        })
    },
})

module.exports = function (opts) {
    if (opts == null) return new DOM({})
    if (Array.isArray(opts)) return new DOM({files: opts})
    if (typeof opts === "object") return new DOM(opts)
    throw new TypeError("`opts` must be an object or array of files if passed")
}
