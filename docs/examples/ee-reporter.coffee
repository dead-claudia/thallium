'use strict'

# An example of an adapter for using event emitters as reporters. The events
# are identical to the API events, except some of the names are changed to be a
# little more idiomatic for event emitters.
#
# API:
#
# t.reporter(...ee: EventEmitter | Reporter)
#
# Events are the same as what's in the API.
# Each event is called the `value` and `path` properties as arguments.

module.exports = ->
    old = @methods.reporter
    @methods.reporter = ->
        old.apply this, (
            for reporter in arguments
                if typeof reporter is 'object' and reporter?
                    do (reporter) -> (ev) ->
                        reporter.emit ev.type, ev
                        return
                else
                    # Don't fix reporter
                    reporter
        )
