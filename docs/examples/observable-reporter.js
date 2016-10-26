"use strict"

// An example reporter wrapper using ES observables. Requires an Observable
// polyfill, but uses `any-observable`.
//
// reporter: Observable
//
// The observable emits the same events as the normal reporters, except "end"
// closes the observable instead.
const Observable = require("any-observable")

module.exports = reflect => new Observable(observer => {
    const reporter = report => {
        if (report.end) observer.complete(report)
        else observer.next(report)
    }

    reflect.reporter(reporter)
    return () => reflect.removeReporter(reporter)
})
