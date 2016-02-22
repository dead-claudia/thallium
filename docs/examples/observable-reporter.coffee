'use strict'

# An example reporter wrapper using ES6 observables. Requires an Observable
# polyfill.
#
# `t.reporter()` -> new Observable
# `t.reporter(args...)` -> as normal

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
