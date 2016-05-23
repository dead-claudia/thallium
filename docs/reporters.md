# Reporters

Thallium reporters are simple functions that accept a set of event objects. It's written to be very unopinionated, easy to work with, and if you feel a need to convert it to something else, it's very straightforward to do.

Reporters are called with an event and either return a thenable or accept a `done` callback, resolved or called respectively when you're done processing the event. Do note that you must call `done` or return an eventually resolved promise, or the runner *will* hang.

## Events

Each event is specified by the `type` property:

- `"start"` - This marks the start of all running tests, and is the first event fired.
- `"enter"` - This marks the start of all child tests within a single test block.
- `"leave"` - This marks the end of all child tests within a single test block.
- `"pass"` - This marks a passing test block with no children.
- `"fail"` - This marks a failing test block with no children. The `value` property is the error that was thrown, unmodified.
- `"skip"` - This marks a skipped test block with no children, via `t.testSkip()` or `t.asyncSkip()`.
- `"end"` - This marks the end of all running tests, and is the last event fired.
- `"extra"` - This marks an extra call to `done` in an asynchronous test. The `value` property is an object with the following properties:

    - `count` - how many times `done` has been called in total so far
    - `value` denotes the last value the callback was called with.

Each event has the following properties:

- `type` - The event's type, as a string.
- `value` - The value associated with the event, or `undefined` if none was specified above for the event's type.
- `path` - The path to the test, from the top-most parent to the current test. For the base test, this is an empty array. Each entry of this array is an object with `name` representing the name of the associated test and `index` representing the 0-based index of the test.

## Event Order

Events are called in the following order:

- Global scope or directly called test:

    1. `"start"` to start the stream
    2. Events for each child test
    3. `"end"` to end the stream

- Test passing and with children:

    1. `"enter"` to denote start of children
    2. Events for each child test
    3. `"leave"` to denote end of children

- Any other test:

    - `"pass"` if all assertions passed
    - `"skip"` if it was skipped via `t.testSkip()` or `t.asyncSkip()`
    - `"fail"` if any assertion failed

## Calling behavior

Normally, reporters are all called at the same time on each event, to speed up calling asynchronous reporters.

If your reporter is asynchronous *and* needs to be the only one running (like writing asynchronously to the console), you should add a truthy `block` property to your reporter. It's generally not preferred, though.

## Options

If you need to take various options, just wrap your reporter in a factory like this:

```js
module.exports = opts => {
    // process your opts here

    return (ev, done) => {
        // do reporter magic here
    }
}
```

## `"extra"` events after `"end"`

If you can't handle them after the exit, you can drop a lock like this, so you can avoid processing to keep out of an invalid state. Note that after the `"end"` event, only two possible events can occur: `"extra"`, since Thallium has already moved on by then, and `"start"`, which means the tests are being run again with the same reporter, within the same Node process.

```js
module.exports = () => {
    let ignore = false

    return (ev, done) => {
        if (ev.type === "extra" && ignore) return done()
        if (ev.type === "start") ignore = false
        if (ev.type === "end") ignore = true

        // do whatever you would normally
    }
}
```

## Why not event emitters? Why not observables?

I'd like to keep Thallium simple and less opinionated. It's easy to wrap the current format, and I've even written plugins to help you out in the case of [event emitters](./examples/ee-reporter.js) and [observables](./examples/observable-reporter.js). There's also CoffeeScript equivalents for each ([event emitters](./examples/ee-reporter.coffee) and [observables](./examples/observable-reporter.coffee)). But functions are still simpler to implement and consume, and the events passed are pretty similar.
