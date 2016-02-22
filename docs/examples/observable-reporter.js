/* global Observable */

// An example reporter wrapper using ES6 observables. Requires an Observable
// polyfill.
//
// `t.reporter()` -> new Observable
// `t.reporter(...args)` -> as normal

export default function (t) {
    t.wrap("reporter", (reporter, ...args) => {
        if (args.length) {
            return reporter(...args)
        } else {
            return new Observable(observer => {
                let subscribed = true

                reporter((ev, done) => {
                    if (subscribed) {
                        if (ev.type === "exit") observer.complete()
                        else observer.next(ev)
                    }

                    return done()
                })

                return () => {
                    subscribed = false
                    observer = undefined // GC assist
                }
            })
        }
    })
}
