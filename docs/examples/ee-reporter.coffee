'use strict'

# An example of an adapter for using event emitters as reporters. The events
# are identical to the API events, except some of the names are changed to be a
# little more idiomatic for event emitters.

# `t.reporter()` accepts multiple reporters or nested arrays of them
readList = (reporters) ->
    for reporter, i in reporters
        if Array.isArray(reporter)
            readList(reporter)
        else if typeof reporter is 'object' and reporter?
            reporters[i] = do (reporter) ->
                (ev, done) ->
                    ev.type = switch ev.type
                        when 'start' then 'enter'
                        when 'end' then 'exit'
                        when 'exit' then 'end'
                        else ev.type

                    reporter.emit ev.type, ev
                    done()
        else
            # Ignore reporter

    reporters

module.exports = ->
    @wrap 'reporter', (reporter, args...) ->
        reporter readList(args)...
