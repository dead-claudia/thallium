"use strict"

// An example of an adapter for using event emitters as reporters. The events
// are identical to the API events.
//
// API:
//
// reporter.add(ee: EventEmitter | Reporter, block?: boolean): void
// reporter.remove(ee: EventEmitter | Reporter, block?: boolean): void
//
// Events are the same as what's in the API, and each event handler is called
// with the event as the sole argument.
const emitters = new WeakMap()

function unwrap(reporter) {
    if (typeof reporter !== "object" || reporter === null) return reporter

    let wrapper = emitters.get(reporter)

    if (wrapper == null) {
        wrapper = report => { reporter.emit(report.type, report) }
        emitters.set(reporter, wrapper)
    }

    return wrapper
}

module.exports = reflect => ({
    add(reporter) {
        reflect.reporter(unwrap(reporter))
    },

    remove(reporter) {
        reflect.removeReporter(unwrap(reporter))
    },
})
