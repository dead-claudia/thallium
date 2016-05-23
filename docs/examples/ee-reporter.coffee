'use strict'

# An example of an adapter for using event emitters as reporters. The events
# are identical to the API events, except some of the names are changed to be a
# little more idiomatic for event emitters.
#
# API:
#
# t.reporter() -> EventEmitter
#
# Events:
# - "start" - all tests started
# - "enter" - test entered
# - "leave" - test entered
# - "pass" - test passed
# - "fail" - test failed
# - "skip" - test skipped
# - "end" - all tests finished
# - "error" - internal or reporter error
# - "extra" - extra `done` call
#
# Each event is called the `value` and `path` properties as arguments.

# `t.reporter()` accepts multiple reporters or nested arrays of them
readList = (reporters) ->
    for reporter, i in reporters
        if Array.isArray(reporter)
            readList(reporter)
        else if typeof reporter is 'object' and reporter?
            reporters[i] = do (reporter) ->
                (ev, done) ->
                    reporter.emit ev.type, ev.value, ev.path
                    done()
        else
            # Ignore reporter

    reporters

module.exports = ->
    @wrap 'reporter', (reporter, args...) ->
        reporter readList(args)...
