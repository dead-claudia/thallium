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
        reporter (
            for reporter in args
                if typeof reporter is 'object' and reporter?
                    do (reporter) -> (ev, done) ->
                        switch
                            when ev.start() then reporter.emit 'start', ev
                            when ev.enter() then reporter.emit 'enter', ev
                            when ev.leave() then reporter.emit 'leave', ev
                            when ev.pass() then reporter.emit 'pass', ev
                            when ev.fail() then reporter.emit 'fail', ev
                            when ev.skip() then reporter.emit 'skip', ev
                            when ev.end() then reporter.emit 'end', ev
                            when ev.error() then reporter.emit 'error', ev
                            when ev.extra() then reporter.emit 'extra', ev
                            else throw new Error 'unreachable'
                        done()
                else
                    # Don't fix reporter
                    reporter
        )...
