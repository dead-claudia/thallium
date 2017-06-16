"use strict"

var Internal = require("../internal")
var assert = require("clean-assert")
var Reports = require("../lib/core/reports")
var methods = require("../lib/methods")

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

    push: function (name) {
        var args = []

        for (var i = 1; i < arguments.length; i++) args.push(arguments[i])
        this.list.push(Reports[name].apply(undefined, args))
    },

    renderChildren: function (node) {
        var index = 0

        for (var i = 0; i < node.tests.length; i++) {
            var child = node.tests[i]

            switch (child.type) {
            case "suite": this.renderSuite(child, index++); break
            case "pass": this.renderPass(child, index++); break
            case "fail": this.renderFail(child, index++); break
            case "skip": this.renderSkip(child, index++); break
            case "suite hook": this.renderSuiteHook(child); break
            case "test hook": this.renderTestHook(child, index); break
            case "origin": this.renderOrigin(child); break
            default: throw new Error("unreachable")
            }
        }
    },

    renderRoot: function (node) {
        this.push("start")
        this.renderChildren(node)
        this.push("end")
        return this.list
    },

    renderSuite: function (node, index) {
        this.enter(node, index)
        this.push("enter", this.path(), node.duration, node.slow)
        this.renderChildren(node)
        this.push("leave", this.path())
        this.leave()
    },

    renderPass: function (node, index) {
        this.enter(node, index)
        this.push("pass", this.path(), node.duration, node.slow)
        this.leave()
    },

    renderFail: function (node, index) {
        this.enter(node, index)
        this.push("fail", this.path(), node.error, node.duration, node.slow,
            node.isFailable)
        this.leave()
    },

    renderSkip: function (node, index) {
        this.enter(node, index)
        this.push("skip", this.path())
        this.leave()
    },

    renderSuiteHook: function (node) {
        var origin = this.origins[this.hooks.indexOf(node.func)]
        var stage

        switch (node.stage) {
        case "before all": stage = Reports.Types.BeforeAll; break
        case "before each": stage = Reports.Types.BeforeEach; break
        case "after each": stage = Reports.Types.AfterEach; break
        case "after all": stage = Reports.Types.AfterAll; break
        default: throw new Error("unreachable")
        }

        this.push("hook", stage, this.path(), origin, node.func, node.error)
    },

    renderTestHook: function (node, index) {
        var origin = this.origins[this.hooks.indexOf(node.func)]
        var stage

        switch (node.stage) {
        case "before all": stage = Reports.Types.BeforeAll; break
        case "before each": stage = Reports.Types.BeforeEach; break
        case "after each": stage = Reports.Types.AfterEach; index--; break
        case "after all": stage = Reports.Types.AfterAll; break
        default: throw new Error("unreachable")
        }

        this.enter(node, index)
        this.push("hook", stage, this.path(), origin, node.func, node.error)
        this.leave()
    },

    renderOrigin: function (node) {
        this.hooks.push(node.func)
        this.origins.push(this.path())
    },
})

function pushEach(ret, each) {
    return function (report) {
        if (each != null) each(report)
        if (report._test == null) {
            // Any equality tests on either of these are inherently flaky.
            if (report.isEnter || report.isPass || report.isFail) {
                assert.isNumber(report.duration)
                assert.isNumber(report.slow)
                if (each == null) {
                    report.duration = 10
                    report.slow = 75
                }
            }

            ret.push(report)
        } else {
            // Any equality tests on either of these are inherently flaky.
            if (report.isEnter || report.isPass || report.isFail) {
                assert.isNumber(report._duration)
                if (each == null) report._duration = 10
            }

            ret.push(convert[report.type](report))
        }
    }
}

exports.wrap = wrap
function wrap(tree, init, each) {
    var ret = []

    return init(pushEach(ret, each), function () {
        if (typeof tree === "function") tree = tree()
        if (!Array.isArray(tree)) tree = new Renderer().renderRoot(tree)
        assert.match(ret, tree)
    }, function () {
        ret.length = 0
    })
}

exports.check = check
function check(opts) {
    if (opts.expected == null) {
        var tt = Internal.root()

        // Don't print anything.
        tt.reporter = function () {}
        opts.init(tt, opts)
        return tt.run(opts.opts)
    }

    if (typeof opts.expected === "function") {
        opts.expected = opts.expected.bind(opts)
    }

    return wrap(opts.expected, function (reporter, check, reset) {
        var tt = Internal.root()

        tt.reporter = reporter
        opts.init(tt, opts)
        return tt.run(opts.opts)
        .then(function () {
            if (!opts.repeat) return undefined
            check()
            reset()
            if (opts.after != null) opts.after(tt, opts)
            return tt.run(opts.opts)
        })
        .then(function () {
            check()
            if (opts.after != null) opts.after(tt, opts)
        })
    }, opts.each == null ? undefined : function (report) {
        opts.each(report, opts)
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

exports.root = function (tests) {
    if (!Array.isArray(tests)) {
        throw new TypeError("`tests` must be an array")
    }

    return {type: "root", tests: tests}
}

exports.suite = function (name, opts, tests) {
    if (tests == null) { tests = opts; opts = undefined }

    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    if (!Array.isArray(tests)) {
        throw new TypeError("`tests` must be an array")
    }

    return {
        type: "suite", name: name, tests: tests,
        duration: opts && opts.duration != null ? opts.duration : 10,
        slow: opts && opts.slow != null ? opts.slow : 75,
    }
}

exports.pass = function (name, opts) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    return {
        type: "pass", name: name,
        duration: opts != null && opts.duration != null ? opts.duration : 10,
        slow: opts != null && opts.slow != null ? opts.slow : 75,
    }
}

exports.fail = function (name, error, opts) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    return {
        type: "fail", name: name, error: error,
        duration: opts != null && opts.duration != null ? opts.duration : 10,
        slow: opts != null && opts.slow != null ? opts.slow : 75,
        isFailable: opts != null && !!opts.isFailable,
    }
}

exports.skip = function (name) {
    if (typeof name !== "string") {
        throw new TypeError("`name` must be a string")
    }

    return {type: "skip", name: name}
}

exports.suiteHook = function (stage, func, error) {
    if (typeof stage !== "string") {
        throw new TypeError("`stage` must be a string")
    }

    if (typeof func !== "function") {
        throw new TypeError("`func` must be a function")
    }

    return {type: "suite hook", stage: stage, func: func, error: error}
}

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

    return {
        type: "test hook",
        name: name, stage: stage,
        func: func, error: error,
    }
}

exports.origin = function (func) {
    if (typeof func !== "function") {
        throw new TypeError("`func` must be a function")
    }

    return {type: "origin", func: func}
}
