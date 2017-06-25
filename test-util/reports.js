"use strict"

var Internal = require("../internal")
var assert = require("clean-assert")
var Constants = require("../lib/core/constants")
var Reports = require("../lib/core/reports")
var methods = require("../lib/methods")
var Util = require("../lib/util")

function getPath(report) {
    var path = []

    while (report.parent != null) {
        path.push({name: report.name, index: report.index})
        report = report.parent
    }

    return path.reverse()
}

function convertAllHook(report, stage) {
    return Reports.hook(stage, getPath(report.parent), getPath(report.origin),
        {name: report.hookName}, report.error)
}

function convertEachHook(report, stage) {
    return Reports.hook(stage, getPath(report), getPath(report.origin),
        {name: report.hookName}, report.error)
}

var convert = {
    "start": function () {
        return Reports.start()
    },

    "enter": function (report) {
        return Reports.enter(getPath(report), report.duration, report.slow)
    },

    "leave": function (report) {
        return Reports.leave(getPath(report))
    },

    "pass": function (report) {
        return Reports.pass(getPath(report), report.duration, report.slow)
    },

    "fail": function (report) {
        return Reports.fail(getPath(report), report.error, report.duration,
            report.slow, report.isFailable)
    },

    "skip": function (report) {
        return Reports.skip(getPath(report))
    },

    "end": function () {
        return Reports.end()
    },

    "error": function (report) {
        return Reports.error(report.error)
    },

    "before all": function (report) {
        return convertAllHook(report, Reports.Types.BeforeAll)
    },

    "before each": function (report) {
        return convertEachHook(report, Reports.Types.BeforeEach)
    },

    "after each": function (report) {
        return convertEachHook(report, Reports.Types.AfterEach)
    },

    "after all": function (report) {
        return convertAllHook(report, Reports.Types.AfterAll)
    },
}

var Type = Object.freeze({
    Suite: 0,
    Pass: 1,
    Fail: 2,
    FailOpt: 3,
    Skip: 4,
    Origin: 5,
    Error: 6,
    SuiteBeforeAll: 7,
    SuiteBeforeEach: 8,
    SuiteAfterEach: 9,
    SuiteAfterAll: 10,
    TestBeforeAll: 11,
    TestBeforeEach: 12,
    TestAfterEach: 13,
    TestAfterAll: 14,
})

var Render = [
    // Type.Suite
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.enter(r.path(), node.duration, node.slow))
        r.renderChildren(node.tests)
        r.push(Reports.leave(r.path()))
        r.leave()
        return true
    },

    // Type.Pass
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.pass(r.path(), node.duration, node.slow))
        r.leave()
        return true
    },

    // Type.Fail
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.fail(r.path(), node.error, node.duration, node.slow,
            false))
        r.leave()
        return true
    },

    // Type.FailOpt
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.fail(r.path(), node.error, node.duration, node.slow,
            true))
        r.leave()
        return true
    },

    // Type.Skip
    function (r, node, index) {
        r.enter(node, index)
        r.push(Reports.skip(r.path()))
        r.leave()
        return true
    },

    // Type.Origin
    function (r, node) {
        r.hooks.push(node.func)
        r.origins.push(r.path())
        return false
    },

    // Type.Error
    function (r, node) {
        r.push(Reports.error(node.error))
        // Easiest way to abort: force a stack unwind
        throw r
    },

    // Type.SuiteBeforeAll
    function (r, node) {
        return r.renderHook(node, Reports.Types.BeforeAll)
    },

    // Type.SuiteBeforeEach
    function (r, node) {
        return r.renderHook(node, Reports.Types.BeforeEach)
    },

    // Type.SuiteAfterEach
    function (r, node) {
        return r.renderHook(node, Reports.Types.AfterEach)
    },

    // Type.SuiteAfterAll
    function (r, node) {
        return r.renderHook(node, Reports.Types.AfterAll)
    },

    // Type.TestBeforeAll
    function (r, node, index) {
        return r.renderTestHook(node, index, Reports.Types.BeforeAll)
    },

    // Type.TestBeforeEach
    function (r, node, index) {
        return r.renderTestHook(node, index, Reports.Types.BeforeEach)
    },

    // Type.TestAfterEach
    function (r, node, index) {
        return r.renderTestHook(node, index - 1, Reports.Types.AfterEach)
    },

    // Type.TestAfterAll
    function (r, node, index) {
        return r.renderTestHook(node, index, Reports.Types.AfterAll)
    },
]

function Renderer() {
    this.list = []
    this.hooks = []
    this.origins = []
    this.current = []
}

methods(Renderer, {
    enter: function (node, index) {
        this.current.push({name: node.name, index: index})
    },

    leave: function () {
        this.current.pop()
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

    renderHook: function (node, stage) {
        this.push(Reports.hook(
            stage,
            this.path(),
            this.origins[this.hooks.indexOf(node.func)],
            node.func, node.error
        ))
        return false
    },

    renderTestHook: function (node, index, stage) {
        this.enter(node, index)
        this.renderHook(node, stage)
        this.leave()
        return false
    },
})

// Any equality tests on either of these are inherently flaky.
function checkReport(ret, report, sanitize) {
    if (report._test == null) {
        if (report.isEnter || report.isPass || report.isFail) {
            assert.isNumber(report.duration)
            assert.isNumber(report.slow)
            if (sanitize) {
                report.duration = 10
                report.slow = 75
            }
        }
    } else {
        if (report.isEnter || report.isPass || report.isFail) {
            assert.isNumber(report._duration)
            if (sanitize) report._duration = 10
        }

        report = convert[report.type](report)
    }

    ret.push(report)
    return report
}

exports.walk = walk
function walk(tree, func) {
    var r = new Renderer()

    try {
        r.push(Reports.start())
        r.renderChildren(tree)
        r.push(Reports.end())
    } catch (e) {
        if (e !== r) throw e
    }
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
    var tt = Internal.root()

    if (opts.expected == null) {
        // Don't print anything.
        tt.reporter = function () {}
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
    var tt = Internal.root()

    if (opts.expected == null) {
        // Don't print anything.
        tt.reporter = function () {}
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

    return {
        type: type, name: name,
        duration: opts != null && opts.duration != null ? opts.duration : 10,
        slow: opts != null && opts.slow != null
            ? opts.slow : Constants.defaultSlow,
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
    var type = opts != null && opts.isFailable ? Type.FailOpt : Type.Fail
    var node = timed(type, name, opts)

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
    "before all": Type.SuiteBeforeAll,
    "before each": Type.SuiteBeforeEach,
    "after each": Type.SuiteAfterEach,
    "after all": Type.SuiteAfterAll,
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
    "before all": Type.TestBeforeAll,
    "before each": Type.TestBeforeEach,
    "after each": Type.TestAfterEach,
    "after all": Type.TestAfterAll,
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
