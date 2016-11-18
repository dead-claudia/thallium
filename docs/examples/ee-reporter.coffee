'use strict'

# An example of an event emitter wrapper to convert it into a reporter. The
# events are identical to the API events.
#
# API:
#
# wrap(reporter: (arg) => EventEmitter): Reporter
#
# Events are the same as the report `type` property in the API, and each event
# handler is called with the report as the sole argument.
module.exports = (reporter) -> (arg) ->
    emitter = reporter(arg)
    (report) ->
        emitter.emit(report.type, report)
        return
