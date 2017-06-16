"use strict"

var Internal = require("../internal")
var assert = require("clean-assert")
var Reports = require("../lib/core/reports")
var methods = require("../lib/methods")
var Util = require("../lib/util")

function getPath(report) {
    var path = []

    while (report.parent != null) {
        path.push({name: report.name, index: report.index})
        report = report.parent
    }

    return path
}

function convertHook(report, stage) {
    return Reports.hook(stage, getPath(report), getPath(report.origin),
        report, report.error)
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
        return Reports.fail(getPath(report), report.duration, report.slow,
            report.isFailable)
    },

    "skip": function (report) {
        return Reports.skip(getPath(report))
    },

    "end": function () {
        return Reports.end()
    },

    "before all": function (report) {
        return convertHook(report, Reports.Types.BeforeAll)
    },

    "before each": function (report) {
        return convertHook(report, Reports.Types.BeforeEach)
    },

    "after each": function (report) {
        return convertHook(report, Reports.Types.AfterEach)
    },

    "after all": function (report) {
        return convertHook(report, Reports.Types.AfterAll)
    },
}

var Type = Object.freeze({
    Suite: 0,
    Pass: 1,
    Fail: 2,
    FailOpt: 3,
    Skip: 4,
    Origin: 5,
    SuiteBeforeAll: 6,
    SuiteBeforeEach: 7,
    SuiteAfterEach: 8,
    SuiteAfterAll: 9,
    TestBeforeAll: 10,
    TestBeforeEach: 11,
    TestAfterEach: 12,
    TestAfterAll: 13,
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

function walk(tree, func) {
    var r = new Renderer()

    r.push(Reports.start())
    r.renderChildren(tree)
    r.push(Reports.end())
    return Util.peach(r.list, func)
}

function Wrap(expected) {
    this.ret = []
    this.expected = expected
}

methods(Wrap, {
    push: function (report) {
        checkReport(this.ret, report, true)
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
        .then(function () { assert.match(self.ret, tree) })
    },
})

exports.wrap = function (expected, init) {
    return new Promise(function (resolve) {
        resolve(init(new Wrap(expected)))
    })
}

function Check(opts, tt) {
    this.ret = []
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
            assert.match(self.ret, list)
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
            report = checkReport(state.ret, report, false)
            return opts.each(report, opts)
        }
    } else {
        tt.reporter = function (report) {
            checkReport(state.ret, report, true)
        }
    }

    return new Promise(function (resolve) { resolve(opts.init(tt, opts)) })
    .then(function () { return state.test() })
    .then(function () {
        if (!opts.repeat) return undefined
        state.ret.length = 0
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

function timed(type, name, opts) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    return {
        type: type, name: name,
        duration: opts != null && opts.duration != null ? opts.duration : 10,
        slow: opts != null && opts.slow != null ? opts.slow : 75,
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
