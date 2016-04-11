'use strict'

# An example reporter wrapper using ES observables. Requires an Observable
# polyfill.
#
# `t.reporter()` -> new Observable
# `t.reporter(args...)` -> as normal
#
# The observable emits the same events as the normal reporters, except "exit"
# terminates the stream instead.

module.exports = ->
    @wrap 'reporter', (reporter, args...) ->
        if args.length
            reporter args...
        else
            new Observable (observer) ->
                subscribed = yes

                reporter (ev, done) ->
                    if subscribed
                        if ev.type is 'exit'
                            observer.complete()
                        else
                            observer.next(ev)

                    done()

                ->
                    subscribed = no
                    observer = undefined # GC assist
