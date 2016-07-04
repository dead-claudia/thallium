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
                return (ev, done) => {
                    switch (true) {
                    case ev.start(): reporter.emit("start", ev); break
                    case ev.enter(): reporter.emit("enter", ev); break
                    case ev.leave(): reporter.emit("leave", ev); break
                    case ev.pass(): reporter.emit("pass", ev); break
                    case ev.fail(): reporter.emit("fail", ev); break
                    case ev.skip(): reporter.emit("skip", ev); break
                    case ev.end(): reporter.emit("end", ev); break
                    case ev.error(): reporter.emit("error", ev); break
                    case ev.extra(): reporter.emit("extra", ev); break
                    default: throw new Error("unreachable")
                    }
                    done()
                }
            } else {
                // Don't fix reporter
                return reporter
            }
        }))
    })
}
