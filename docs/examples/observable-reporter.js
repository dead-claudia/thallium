/* global Observable */

// An example reporter wrapper using ES observables. Requires an Observable
// polyfill.
//
// `t.reporter()` -> new Observable
// `t.reporter(...args)` -> as normal
//
// The observable emits the same events as the normal reporters, except "exit"
// terminates the stream instead.

export default function ({methods}) {
    const old = methods.reporter

    methods.reporter = function (...args) {
        if (args.length) {
            return old.apply(this, args)
        } else {
            return new Observable(observer => {
                let subscribed = true

                old.call(this, ev => {
                    if (subscribed) {
                        if (ev.end) observer.complete()
                        else observer.next(ev)
                    }
                })

                return () => {
                    subscribed = false
                    observer = undefined // GC assist
                }
            })
        }
    }
}
