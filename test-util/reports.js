"use strict"

var assert = require("clean-assert")
var Reports = require("../lib/core/reports")

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

/* eslint-disable max-len */
function convert(report) {
    switch (report.type) {
    case "start": return Reports.start()
    case "enter": return Reports.enter(getPath(report), report.duration, report.slow)
    case "leave": return Reports.leave(getPath(report))
    case "pass": return Reports.pass(getPath(report), report.duration, report.slow)
    case "fail": return Reports.fail(getPath(report), report.duration, report.slow, report.isFailable)
    case "skip": return Reports.skip(getPath(report))
    case "end": return Reports.end()
    case "before all": return convertHook(report, Reports.Types.BeforeAll)
    case "before each": return convertHook(report, Reports.Types.BeforeEach)
    case "after each": return convertHook(report, Reports.Types.AfterEach)
    case "after all": return convertHook(report, Reports.Types.AfterAll)
    default: throw new Error("unreachable")
    }
}
/* eslint-enable max-len */

exports.push = function (ret, keep) {
    return function (report) {
        // Any equality tests on either of these are inherently flaky.
        // Only add the relevant properties
        if (report.isFail || report.isError || report.isHook) {
            assert.hasOwn(report, "error")
        }

        if (report.isEnter || report.isPass || report.isFail) {
            assert.isNumber(report.duration)
            assert.isNumber(report.slow)
            if (!keep) {
                report.duration = 10
                report.slow = 75
            }
        }

        if (report._test == null) {
            ret.push(report)
        } else {
            ret.push(convert(report))
        }
    }
}
