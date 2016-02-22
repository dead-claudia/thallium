// An example of an adapter for using event emitters as reporters. The events
// are identical to the API events, except some of the names are changed to be a
// little more idiomatic for event emitters.

// `t.reporter()` accepts multiple reporters or nested arrays of them
function readList(reporters) {
    for (let i = 0; i < reporters.length; i++) {
        const reporter = reporters[i]

        if (Array.isArray(reporter)) {
            readList(reporter)
        } else if (typeof reporter === "object" && reporter != null) {
            reporters[i] = (ev, done) => {
                if (ev.type === "start") ev.type = "enter"
                else if (ev.type === "end") ev.type = "exit"
                else if (ev.type === "exit") ev.type = "end"

                reporter.emit(ev.type, ev)
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
