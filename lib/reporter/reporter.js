"use strict"

var methods = require("../methods.js")
var ReporterUtil = require("./util.js")
var Resolver = require("../resolver.js")
var Tree = require("./tree.js")

function promisify0(f, inst) {
    return function () { return Resolver.resolve0(f, inst) }
}

/**
 * This contains a high-level description of a test error event, since `fail`
 * and `extra` events are very closely handled in some of the reporters.
 */
function ErrorSpec(event, extra) {
    this.event = event
    this.extra = extra
}

function State(reporter) {
    if (typeof reporter.methods.init === "function") {
        (0, reporter.methods.init)(this, reporter.opts)
    }
}

/**
 * Superclass for all reporters. This covers the state for pretty much every
 * reporter.
 *
 * Note that if you delay the initial reset, you still must call it before the
 * constructor finishes.
 */
module.exports = Reporter
function Reporter(Tree, opts, methods, delay) {
    this.Tree = Tree
    this.opts = opts != null ? opts : {}
    this.methods = methods
    ReporterUtil.defaultify(this, "reset", promisify0)
    if (!delay) this.reset()
}

methods(Reporter, {
    reset: function () {
        this.running = false
        this.timePrinted = false
        this.tests = 0
        this.pass = 0
        this.fail = 0
        this.skip = 0
        this.duration = 0
        this.errors = []
        this.state = new State(this)
        this.base = new this.Tree(null)
        this.cache = {path: null, result: null}
    },

    pushError: function (ev, extra) {
        this.errors.push(new ErrorSpec(ev, extra))
    },

    get: function (path) {
        return Tree.getPath(this, path)
    },
})
