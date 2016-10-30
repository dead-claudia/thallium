'use strict'

# An example reporter wrapper using ES observables. Requires an Observable
# polyfill, but uses `any-observable`.
#
# reporter: Observable
#
# The observable emits the same events as the normal reporters, except 'end'
# closes the observable instead.
Observable = require 'any-observable'

module.exports = (reflect) ->
    new Observable (observer) ->
        reporter = -> (report) ->
            if report.end then observer.complete(report)
            else observer.next(report)
            return

        reflect.reporter(reporter)
        -> reflect.removeReporter(reporter)
