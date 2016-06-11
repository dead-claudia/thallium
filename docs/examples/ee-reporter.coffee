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
    @reflect().wrap 'reporter', (reporter, args...) ->
        reporter.apply undefined, args.map (reporter) ->
            if typeof reporter is 'object' and reporter?
                (ev, done) ->
                    reporter.emit ev.type, ev.value, ev.path
                    done()
            else
                # Don't fix reporter
                reporter
