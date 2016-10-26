'use strict'

# An example of an adapter for using event emitters as reporters. The events
# are identical to the API events.
#
# API:
#
# reporter.add(ee: EventEmitter | Reporter, block?: boolean): void
# reporter.remove(ee: EventEmitter | Reporter): void
#
# Events are the same as what's in the API, and each event handler is called
# with the event as the sole argument.
emitters = new WeakMap

unwrap = (reporter) ->
    unless typeof reporter is 'object' and reporter?
        reporter
    else
        wrapper = emitters.get(reporter)
        unless wrapper?
            wrapper = (report) ->
                reporter.emit(report.type, report)
                return
            emitters.set(reporter, wrapper)
        wrapper

module.exports = (reflect) ->
    add: (reporter) -> reflect.reporter unwrap(reporter)
    remove: (reporter) -> reflect.removeReporter unwrap(reporter)
