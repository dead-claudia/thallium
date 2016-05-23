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

// `t.reporter()` accepts multiple reporters or nested arrays of them
function readList(reporters) {
    for (let i = 0; i < reporters.length; i++) {
        const reporter = reporters[i]

        if (Array.isArray(reporter)) {
            readList(reporter)
        } else if (typeof reporter === "object" && reporter != null) {
            reporters[i] = (ev, done) => {
                reporter.emit(ev.type, ev.value, ev.path)
                return done()
            }
        } else {
            // Ignore reporter
        }
    }

    return reporters
}

export default function (t) {
    t.wrap("reporter", (reporter, ...args) =>
        reporter(...readList(args)))
}
