"use strict"

var Promise = require("bluebird")
var Flags = require("./flags.js")
var Resolver = require("../resolver.js")
var Report = require("./report.js")

exports.r = function (type, value, duration) {
    if (Report.hasDuration(type)) {
        return new Report.ReportData(type, value, duration)
    } else {
        return new Report.ReportData(type, value, 0)
    }
}

exports.result = function (time, attempt) {
    return new Report.ResultData(time, attempt.caught,
        attempt.caught ? attempt.value : undefined)
}

function path(test) {
    var ret = []
    var ctx = test

    while (!(ctx.status & Flags.Root)) {
        ret.push(new Report.Location(ctx.data.name, ctx.data.index))
        ctx = ctx.data.parent
    }

    return ret.reverse()
}

function makeReport(args, test) {
    if (Report.hasDuration(args.type)) {
        return new Report.Report(args.type, path(test), args.value,
            args.duration, slow(test))
    } else {
        return new Report.Report(args.type, path(test), args.value, -1, 0)
    }
}

exports.report = function (test, args) {
    // Reporters are allowed to block, and these are always called first.
    var blocking = []
    var concurrent = []
    var list = test.reporters

    for (var i = 0; i < list.length; i++) {
        var reporter = list[i]

        if (reporter.block) {
            blocking.push(reporter)
        } else {
            concurrent.push(reporter)
        }
    }

    function pcall(reporter) {
        return Resolver.resolve1(reporter, undefined, makeReport(args, test))
    }

    return Promise.each(blocking, pcall)
    .return(concurrent)
    .map(pcall)
    .return()
}

// Note that a timeout of 0 means to inherit the parent.
exports.timeout = function (test) {
    var ctx = test

    while (ctx.timeout === 0 && !(ctx.status & Flags.Root)) {
        ctx = ctx.data.parent
    }

    return ctx.timeout !== 0 ? ctx.timeout : 2000 // ms - default timeout
}

// Note that a slowness threshold of 0 means to inherit the parent.
exports.slow = slow
function slow(test) {
    var ctx = test

    while (ctx.slow === 0 && !(ctx.status & Flags.Root)) {
        ctx = ctx.data.parent
    }

    return ctx.slow !== 0 ? ctx.slow : 75 // ms - default slow threshold
}
