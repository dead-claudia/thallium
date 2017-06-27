"use strict"

var Internal = require("../internal")
var assert = require("clean-assert")
var Reports = require("../lib/core/reports-tree")
var Tests = require("../lib/core/tests-tree")
var methods = require("../lib/methods")
var Util = require("../lib/util")

// Shared no-op reference for easier matching
exports.noop = function () {}

exports.silent = function () {
    var tt = Internal.root()

    tt.reporter = exports.noop
    return tt
}

exports.initReflect = function (tt) {
    tt.reflect // eslint-disable-line no-unused-expressions
}

var Type = Object.freeze({
    Suite: 0,
    Pass: 1,
    Fail: 2,
    Skip: 3,
    Origin: 4,
    Error: 5,
    BeforeAll: 6,
    BeforeEach: 7,
    AfterEach: 8,
    AfterAll: 9,
})

var Render = [
    // Type.Suite
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.enter(r.current, node.duration))
        r.renderChildren(node.tests)
        r.push(Reports.leave(r.current))
        return true
    },

    // Type.Pass
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.pass(r.current, node.duration))
        r.leave()
        return true
    },

    // Type.Fail
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.fail(r.current, node.duration, node.error))
        r.leave()
        return true
    },

    // Type.Skip
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.skip(r.current))
        r.leave()
        return true
    },

    // Type.Origin
    function (r, node) {
        r.hooks.push(node.func)
        r.origins.push(r.current)
        return false
    },

    // Type.Error
    function (r, node) {
        r.push(Reports.error(node.error))
        // Easiest way to abort: force a stack unwind
        throw r
    },

    // Type.BeforeAll
    function (r, node) {
        return r.renderHook(node, Reports.beforeAll)
    },

    // Type.BeforeEach
    function (r, node, index) {
        return r.renderTestHook(node, index, Reports.beforeEach)
    },

    // Type.AfterEach
    function (r, node, index) {
        return r.renderTestHook(node, index - 1, Reports.afterEach)
    },

    // Type.AfterAll
    function (r, node) {
        return r.renderHook(node, Reports.afterAll)
    },
]

function Renderer() {
    this.list = []
    this.hooks = []
    this.origins = []
    this.current = Reports.data(exports.silent()._)
}

methods(Renderer, {
    enter: function (node, index) {
        Tests.addTest(this.current._.test, node.name, exports.noop)
        var test = this.current._.test.tests.pop()

        exports.initReflect(test)

        test.index = index
        if (node.timeout != null) test.timeout = node.timeout
        if (node.slow != null) test.slow = node.slow
        if (node.isFailable != null) test.isFailable = node.isFailable
        this.current = Reports.data(test, this.current)
        Reports.deref(this.current)
    },

    leave: function () {
        this.current = this.current.parent
    },

    path: function () {
        return this.current.slice()
    },

    push: function (report) {
        this.list.push(report)
    },

    renderChildren: function (tests) {
        var index = 0

        for (var i = 0; i < tests.length; i++) {
            if (Render[tests[i].type](this, tests[i], index)) index++
        }
    },

    renderHook: function (node, factory) {
        this.push(factory(
            this.current,
            this.origins[this.hooks.indexOf(node.func)],
            node.error, node.func
        ))
        return false
    },

    renderTestHook: function (node, index, factory) {
        this.enter(node, index)
        this.renderHook(node, factory)
        this.leave()
        return false
    },
})

// Any equality tests on either of these are inherently flaky.
function checkReport(ret, report, sanitize) {
    if (report.isEnter || report.isPass || report.isFail) {
        assert.isNumber(report.duration)
        if (sanitize) report._.duration = 10
    }

    ret.push(report)
    return report
}

exports.walk = walk
function walk(tree, func) {
    var r = new Renderer()

    try {
        r.push(Reports.start(r.current))
        r.renderChildren(tree)
        r.push(Reports.end(r.current))
    } catch (e) {
        if (e !== r) throw e
    }

    Reports.deref(r.current)
    return Util.peach(r.list, func)
}

function Wrap(expected) {
    this.cooked = []
    this.raw = []
    this.expected = expected
}

methods(Wrap, {
    get: function (index) {
        return this.raw[index]
    },

    push: function (report) {
        this.raw.push(report)
        checkReport(this.cooked, report, true)
    },

    check: function () {
        var tree = []
        var self = this

        return Promise.resolve()
        .then(function () {
            if (typeof self.expected === "function") {
                return walk((0, self.expected)(), function (v) { tree.push(v) })
            } else if (self.expected != null) {
                return walk(self.expected, function (v) { tree.push(v) })
            } else {
                return undefined
            }
        })
        .then(function () { assert.match(tree, self.cooked) })
    },
})

exports.wrap = function (expected, init) {
    return new Promise(function (resolve) {
        resolve(init(new Wrap(expected)))
    })
}

function Check(opts, tt) {
    this.reports = []
    this.opts = opts
    this.tt = tt
}

methods(Check, {
    test: function () {
        var list = []
        var self = this

        return this.tt.run(self.opts.opts)
        .then(function () {
            if (typeof self.opts.expected === "function") {
                return walk(self.opts.expected(), function (v) { list.push(v) })
            } else if (self.opts.expected != null) {
                return walk(self.opts.expected, function (v) { list.push(v) })
            } else {
                return undefined
            }
        })
        .then(function () {
            assert.match(self.reports, list)
            if (self.opts.after == null) return undefined
            return self.opts.after(self.tt, self.opts)
        })
    },

    testTree: function () {
        var list = []
        var self = this

        return this.tt.runTree(self.opts.opts)
        .then(function () {
            if (typeof self.opts.expected === "function") {
                return walk(self.opts.expected(), function (v) { list.push(v) })
            } else if (self.opts.expected != null) {
                return walk(self.opts.expected, function (v) { list.push(v) })
            } else {
                return undefined
            }
        })
        .then(function () {
            assert.match(self.reports, list)
            if (self.opts.after == null) return undefined
            return self.opts.after(self.tt, self.opts)
        })
    },
})

exports.check = check
function check(opts) {
    var tt = exports.silent()

    if (opts.expected == null) {
        opts.init(tt, opts)
        return tt.run(opts.opts)
    }

    var state = new Check(opts, tt)

    // Any equality tests on either of these are inherently flaky.
    if (opts != null && opts.each != null) {
        tt.reporter = function (report) {
            report = checkReport(state.reports, report, false)
            return opts.each(report, opts)
        }
    } else {
        tt.reporter = function (report) {
            checkReport(state.reports, report, true)
        }
    }

    return new Promise(function (resolve) { resolve(opts.init(tt, opts)) })
    .then(function () { return state.test() })
    .then(function () {
        if (!opts.repeat) return undefined
        state.reports.length = 0
        return state.test()
    })
}

exports.test = function (name, opts) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    (opts.it || global.it)(name, function () {
        return check(Object.create(opts))
    })
}

exports.checkTree = checkTree
function checkTree(opts) {
    var tt = exports.silent()

    if (opts.expected == null) {
        opts.init(tt, opts)
        return tt.runTree(opts.opts)
    }

    var state = new Check(opts, tt)

    // Any equality tests on either of these are inherently flaky.
    if (opts != null && opts.each != null) {
        tt.reporter = function (report) {
            report = checkReport(state.reports, report, false)
            return opts.each(report, opts)
        }
    } else {
        tt.reporter = function (report) {
            checkReport(state.reports, report, true)
        }
    }

    return new Promise(function (resolve) { resolve(opts.init(tt, opts)) })
    .then(function () { return state.testTree() })
    .then(function () {
        if (!opts.repeat) return undefined
        state.reports.length = 0
        return state.testTree()
    })
}

exports.testTree = function (name, opts) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    (opts.it || global.it)(name, function () {
        return checkTree(Object.create(opts))
    })
}

function timed(type, name, opts) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    if (opts == null) {
        return {type: type, name: name, duration: 10}
    } else {
        return {
            type: type, name: name,
            duration: opts.duration != null ? opts.duration : 10,
            timeout: opts.timeout,
            slow: opts.slow,
            isFailable: opts.isFailable,
        }
    }
}

exports.suite = function (name, opts, tests) {
    if (tests == null) { tests = opts; opts = undefined }

    var node = timed(Type.Suite, name, opts)

    if (!Array.isArray(tests)) {
        throw new TypeError("`tests` must be an array")
    }

    node.tests = tests
    return node
}

exports.pass = function (name, opts) {
    return timed(Type.Pass, name, opts)
}

exports.fail = function (name, error, opts) {
    var node = timed(Type.Fail, name, opts)

    node.error = error
    return node
}

exports.skip = function (name) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    return {type: Type.Skip, name: name}
}

exports.origin = function (func) {
    if (typeof func !== "function") {
        throw new TypeError("`func` must be a function")
    }

    return {type: Type.Origin, func: func}
}

exports.error = function (error) {
    return {type: Type.Error, error: error}
}

var SuiteStage = Object.freeze({
    "before all": Type.BeforeAll,
    "after all": Type.AfterAll,
})

exports.suiteHook = function (stage, func, error) {
    if (typeof stage !== "string") {
        throw new TypeError("`stage` must be a string")
    }

    if (typeof func !== "function") {
        throw new TypeError("`func` must be a function")
    }

    return {type: SuiteStage[stage], func: func, error: error}
}

var TestStage = Object.freeze({
    "before each": Type.BeforeEach,
    "after each": Type.AfterEach,
})

exports.testHook = function (name, stage, func, error) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    if (typeof stage !== "string") {
        throw new TypeError("`stage` must be a string")
    }

    if (typeof func !== "function") {
        throw new TypeError("`func` must be a function")
    }

    return {type: TestStage[stage], name: name, func: func, error: error}
}
