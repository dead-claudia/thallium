// An example of an adapter for using event emitters as reporters. The events
// are identical to the API events, except some of the names are changed to be a
// little more idiomatic for event emitters.
//
// API:
//
// t.reporter(...ee: EventEmitter | Reporter)
//
// Events are the same as what's in the API.
// Each event is called the `value` and `path` properties as arguments.

export default function (t) {
    t.reflect().wrap("reporter", (reporter, ...args) => {
        return reporter(...args.map(reporter => {
            if (typeof reporter === "object" && reporter != null) {
                return ev => { reporter.emit(ev.type(), ev) }
            } else {
                // Don't fix reporter
                return reporter
            }
        }))
    })
}
