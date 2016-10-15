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
    old = @methods.reporter
    @methods.reporter = ->
        if arguments.length
            old.apply this, arguments
        else
            new Observable (observer) ->
                subscribed = yes

                old.call this, (ev) ->
                    if subscribed
                        if ev.end
                            observer.complete()
                        else
                            observer.next(ev)
                    return

                ->
                    subscribed = no
                    observer = undefined # GC assist
