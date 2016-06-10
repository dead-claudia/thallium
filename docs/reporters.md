# Reporters

Thallium comes with a few built-in reporters, but currently, they are a work in progress. At the time of writing, there are two reporters finished, but there are more to come:

- `thallium/r/tap` - A [TAP-compatible](https://testanything.org) reporter, for you to use with various tools.
- `thallium/r/spec` - A reporter modeled very closely to Mocha's default `spec` reporter.
- `thallium/r/dot` - A reporter modeled very closely to Mocha's default `dot` reporter.

Each built-in reporter must be called like so, and if you don't, you'll get reminded with an error:

```js
// Note the function call of the default export.
t.reporter(require("thallium/r/spec")())
```

Each reporter accepts an object with a `print` function, which will be called with each line, dependent on the window size of the terminal. Note that terminal colors may be embedded in the output, if colors are supported or forced through setting the `THALLIUM_COLORS` variable.

---

If you would prefer to create your own reporter, it's relatively straightforward to do so. Thallium reporters are simple functions that accept a set of event objects. It's written to be very unopinionated, easy to work with, and if you feel a need to convert it to something else, it's very straightforward to do.

Reporters are called with an event and either return a thenable or accept a `done` callback. Note that you must either resolve the thenable or call the `done` callback *at some point*, because Thallium waits for all reporters to finish before continuing what it was doing.

## Events

Each event is specified by the `type` property:

- `"start"` - Marks the start of all running tests, and is the first event fired.
- `"enter"` - Marks the start of all child tests within a single test block.
- `"leave"` - Marks the end of all child tests within a single test block.
- `"pass"` - Marks a passing test block with no children.
- `"fail"` - Marks a failing test block with no children. The `value` is the error that was thrown, untouched.
- `"skip"` - Marks a skipped test block with no children, via `t.testSkip()` or `t.asyncSkip()`.
- `"end"` - Marks the end of all running tests, and is the last event fired.
- `"error"` - An internal/reporter error, provided for pretty-printing and the ability to close resources.
- `"extra"` - Marks an extra call to `done` in an async test. The `value` is an object with the following properties:

    - `count` - how many times `done` has been called in total so far
    - `value` denotes the last value the callback was called with.

Each event has the following properties:

- `type` - The event's type, as a string.
- `value` - The value associated with the event, or `undefined` if none was specified above for the event's type.
- `path` - The path to the test, from the top-most parent to the current test. For the base test, this is an empty array. Each entry of this array is an object with `name` representing the name of the associated test and `index` representing the 0-based index of the test.
- `slow` - The active slow duration for the test. This is positive for `"pass"`, `"fail"`, and `"enter"` events, and 0 for all others.
- `duration` - The time it took for this test to complete. This is either 0 or positive for `"pass"`, `"fail"`, and `"enter"` events, and -1 for all others.

Additionally, there is an `"error"` event that handles errors either internally or from the reporter itself. At this point, it's recommended to close the reporter, as it's no longer safe to continue. As an exception, errors from handling `"extra"` reports are silently ignored for practical reasons (it's an exceptionally complex problem, where I'd have to roll my own async abstraction), and errors from handling `"error"` reports are fatal. If you would prefer to just propagate those errors, you can simply rethrow the event's `value`.

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

If your reporter is synchronous, remember to call `done` or return a resolved `Promise`/thenable at the end.

If your reporter is async *and* needs to be the only one running for some reason (like multiple reporters working with a poorly written server), you should add a truthy `block` property to your reporter. It's not preferred, because if you want to, for example, use a reporter that logs to a file, that will have to wait until after the blocking reporter finishes.

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

The built-in reporters do this as well.

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
