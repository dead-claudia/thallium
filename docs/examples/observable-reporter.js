/* global Observable */

// An example reporter wrapper using ES observables. Requires an Observable
// polyfill.
//
// `t.reporter()` -> new Observable
// `t.reporter(...args)` -> as normal
//
// The observable emits the same events as the normal reporters, except "exit"
// terminates the stream instead.

export default function (t) {
    t.reflect().wrap("reporter", (reporter, ...args) => {
        if (args.length) {
            return reporter(...args)
        } else {
            return new Observable(observer => {
                let subscribed = true

                reporter(ev => {
                    if (subscribed) {
                        if (ev.end()) observer.complete()
                        else observer.next(ev)
                    }
                })

                return () => {
                    subscribed = false
                    observer = undefined // GC assist
                }
            })
        }
    })
}
