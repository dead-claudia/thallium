// An example of an adapter for using event emitters as reporters. The events
// are identical to the API events, except some of the names are changed to be a
// little more idiomatic for event emitters.
//
// API:
//
// t.reporter() -> EventEmitter
//
// Events:
// - "enter" - test entered
// - "leave" - test left
// - "pass" - test passed
// - "fail" - test failed
// - "pending" - test pending
// - "end" - end of the test suite
// - "extra" - extra `done` call
//
// Each event is called the `value` and `path` properties as arguments.

// `t.reporter()` accepts multiple reporters or nested arrays of them
function readList(reporters) {
    for (let i = 0; i < reporters.length; i++) {
        const reporter = reporters[i]

        if (Array.isArray(reporter)) {
            readList(reporter)
        } else if (typeof reporter === "object" && reporter != null) {
            reporters[i] = (ev, done) => {
                if (ev.type === "start") ev.type = "enter"
                else if (ev.type === "end") ev.type = "leave"
                else if (ev.type === "exit") ev.type = "end"

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
